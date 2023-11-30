import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { SignUpUserDto } from './dto/signup-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

import * as bcrypt from 'bcryptjs';
import { SignInUserDto } from './dto/signin-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisRepository } from './redis.repository';
import { UserEnum, UserShareStatus } from './enums/user.enum';
import { JwtEnum } from './enums/jwt.enum';
import {
	createJwt,
	getOAuthAccessToken,
	getOAuthUserData,
} from '../util/auth.util';
import { v4 as uuid } from 'uuid';
import { UserDataDto } from './dto/user-data.dto';
import { ShareLink } from './entities/share_link.entity';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(ShareLink)
		private readonly shareLinkRepository: Repository<ShareLink>,
		private readonly jwtService: JwtService,
		private readonly redisRepository: RedisRepository,
	) {}

	async signUp(signUpUserDto: SignUpUserDto): Promise<Partial<User>> {
		const { username, nickname } = signUpUserDto;
		await Promise.all([
			this.isAvailableNickname(nickname),
			this.isAvailableUsername(username),
		]);

		const salt = await bcrypt.genSalt();
		const hashedPassword = await bcrypt.hash(signUpUserDto.password, salt);

		const newUser = this.userRepository.create({
			...signUpUserDto,
			password: hashedPassword,
		});

		const savedUser: User = await this.userRepository.save(newUser);
		savedUser.password = undefined;

		return savedUser;
	}

	async signIn(signInUserDto: SignInUserDto) {
		const { username, password } = signInUserDto;

		const user = await this.userRepository.findOneBy({ username });

		if (!user) {
			throw new NotFoundException(UserEnum.NOT_EXIST_USERNAME_MESSAGE);
		}

		const isCorrectPassword = await bcrypt.compare(password, user.password);
		if (!isCorrectPassword) {
			throw new UnauthorizedException(UserEnum.UNCORRECT_PASSWORD_MESSAGE);
		}

		const [accessToken, refreshToken] = await Promise.all([
			createJwt(user, JwtEnum.ACCESS_TOKEN_TYPE, this.jwtService),
			createJwt(user, JwtEnum.REFRESH_TOKEN_TYPE, this.jwtService),
		]);

		this.redisRepository.set(username, refreshToken);

		return { accessToken, refreshToken };
	}

	async signOut(user: UserDataDto) {
		this.redisRepository.del(user.username);
	}

	async isAvailableUsername(username: string): Promise<boolean> {
		if (!username) {
			throw new BadRequestException('username is required');
		}

		const user = await this.userRepository.findOneBy({ username });

		if (user) {
			throw new ConflictException('username already exists');
		} else {
			return true;
		}
	}

	async isAvailableNickname(nickname: string): Promise<boolean> {
		if (!nickname) {
			throw new BadRequestException('nickname is required');
		}

		const user = await this.userRepository.findOneBy({ nickname });

		if (user) {
			throw new ConflictException('nickname already exists');
		} else {
			return true;
		}
	}

	async oauthCallback(service: string, authorizedCode: string, state?: string) {
		if (!authorizedCode) {
			throw new BadRequestException('Authorized Code가 존재하지 않습니다.');
		}

		const resourceServerAccessToken = await getOAuthAccessToken(
			service,
			authorizedCode,
			state,
		);
		const resourceServerUsername = await getOAuthUserData(
			service,
			resourceServerAccessToken,
		);

		const user = await this.userRepository.findOneBy({
			username: resourceServerUsername,
		});

		if (!user) {
			this.redisRepository.set(
				resourceServerUsername,
				resourceServerAccessToken,
			);
			return {
				username: resourceServerUsername,
				accessToken: null,
				refreshToken: null,
			};
		}

		const [accessToken, refreshToken] = await Promise.all([
			createJwt(user, JwtEnum.ACCESS_TOKEN_TYPE, this.jwtService),
			createJwt(user, JwtEnum.REFRESH_TOKEN_TYPE, this.jwtService),
		]);

		this.redisRepository.set(user.username, refreshToken);

		return {
			username: null,
			accessToken,
			refreshToken,
		};
	}

	async signUpWithOAuth(
		service: string,
		nickname: string,
		resourceServerUsername: any,
	) {
		let recivedResourceServerUsername: string;
		try {
			const resourceServerAccessToken: string = await this.redisRepository.get(
				resourceServerUsername,
			);
			recivedResourceServerUsername = await getOAuthUserData(
				service,
				resourceServerAccessToken,
			);
		} catch (e) {
			throw new UnauthorizedException('잘못된 접근입니다.');
		}

		if (recivedResourceServerUsername !== resourceServerUsername) {
			throw new UnauthorizedException('잘못된 접근입니다.');
		}

		this.redisRepository.del(resourceServerUsername);

		const newUser: User = this.userRepository.create({
			username: resourceServerUsername,
			password: uuid(),
			nickname,
		});

		const savedUser: User = await this.userRepository.save(newUser);
		savedUser.password = undefined;

		return savedUser;
	}

	async searchUser(nickname: string): Promise<User[]> {
		const users: User[] = await this.userRepository
			.createQueryBuilder('user')
			.select(['user.id', 'user.nickname'])
			.where(`MATCH (user.nickname) AGAINST (:nickname IN BOOLEAN MODE)`, {
				nickname: nickname + '*',
			})
			.getMany();
		return users;
	}

	async changeStatus(userData: UserDataDto, status: UserShareStatus) {
		const user = await this.userRepository.findOneBy({ id: userData.userId });

		if (!user) {
			throw new NotFoundException('해당 유저를 찾을 수 없습니다.');
		}

		if (user.status === status) {
			throw new BadRequestException('이미 해당 상태입니다.');
		}

		user.status = status;
		const updatedUser = await this.userRepository.save(user);

		updatedUser.password = undefined;
		return updatedUser;
	}

	async getShareLink(userData: UserDataDto) {
		if (userData.status === UserShareStatus.PRIVATE) {
			throw new BadRequestException('비공개 상태입니다.');
		}

		const foundLink = await this.shareLinkRepository.findOneBy({
			user: userData.userId,
		});

		if (foundLink) {
			return foundLink;
		}

		const newLink = this.shareLinkRepository.create({
			user: userData.userId,
			link: uuid(),
		});

		const savedLink = await this.shareLinkRepository.save(newLink);
		savedLink.user = undefined;
		return savedLink;
	}
}
