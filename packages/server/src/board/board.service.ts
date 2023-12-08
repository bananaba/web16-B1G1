import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { DataSource, DeleteResult, EntityManager, Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { encryptAes } from '../util/aes.util';
import { User } from '../auth/entities/user.entity';
import { UserDataDto } from '../auth/dto/user-data.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Star } from '../star/schemas/star.schema';
import { Model } from 'mongoose';
import { FileService } from './file.service';

@Injectable()
export class BoardService {
	constructor(
		private readonly fileService: FileService,
		private readonly dataSource: DataSource,
		@InjectRepository(Board)
		private readonly boardRepository: Repository<Board>,
		@InjectRepository(Image)
		private readonly imageRepository: Repository<Image>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectModel(Star.name)
		private readonly starModel: Model<Star>,
	) {}

	async createBoard(
		createBoardDto: CreateBoardDto,
		userData: UserDataDto,
		files: Express.Multer.File[],
	): Promise<Board> {
		let createdBoard: Board;

		await this.dataSource.transaction(async (manager: EntityManager) => {
			const { title, content, star } = createBoardDto;

			const user: User = await manager.findOneBy(User, {
				id: userData.userId,
			});

			const images: Image[] = [];
			if (files && files.length > 0) {
				for (const file of files) {
					// Object Storage에 업로드
					const imageInfo = await this.fileService.uploadFile(file);

					// 이미지 리포지토리에 저장
					const image = manager.create(Image, {
						...imageInfo,
					});

					const createdImage = await manager.save(image);

					images.push(createdImage);
				}
			}

			// 별 스타일이 존재하면 MongoDB에 저장
			let star_id: string;
			if (star) {
				const starDoc = new this.starModel({
					...JSON.parse(star),
				});
				await starDoc.save();
				star_id = starDoc._id.toString();
			}

			const board = manager.create(Board, {
				title,
				content: encryptAes(content), // AES 암호화하여 저장
				user,
				images,
				star: star_id,
			});
			createdBoard = await manager.save(board);

			createdBoard.user.password = undefined; // password 제거하여 반환
		});

		return createdBoard;
	}

	async findBoardById(id: number): Promise<Board> {
		const found: Board = await this.boardRepository
			.createQueryBuilder()
			.select(['board.id', 'board.title', 'board.content', 'board.like_cnt'])
			.from(Board, 'board')
			.leftJoinAndMapMany(
				'board.images',
				Image,
				'image',
				'image.boardId = board.id',
			)
			.where('board.id = :id', { id })
			.getOne();

		if (!found) {
			throw new NotFoundException('board not found');
		}
		return found;
	}

	async updateBoard(
		id: number,
		updateBoardDto: UpdateBoardDto,
		userData: UserDataDto,
		files: Express.Multer.File[],
	): Promise<Board> {
		let updatedBoard: Board;

		await this.dataSource.transaction(async (manager: EntityManager) => {
			const board: Board = await manager.findOneBy(Board, { id });
			if (!board) {
				throw new NotFoundException('board not found');
			}

			// 게시글 작성자와 수정 요청자가 다른 경우
			if (board.user.id !== userData.userId) {
				throw new BadRequestException('not your post');
			}

			// star에 대한 수정은 별도 API(PATCH /star/:id)로 처리하므로 400 에러 리턴
			if (updateBoardDto.star) {
				throw new BadRequestException('cannot update star');
			}

			if (files && files.length > 0) {
				const images: Image[] = [];
				for (const file of files) {
					const imageInfo = await this.fileService.uploadFile(file);

					const image = manager.create(Image, {
						...imageInfo,
					});

					const updatedImage = await manager.save(image);
					images.push(updatedImage);
				}
				// 기존 이미지 삭제
				for (const image of board.images) {
					// 이미지 리포지토리에서 삭제
					await manager.delete(Image, { id: image.id });
					// NCP Object Storage에서 삭제
					await this.fileService.deleteFile(image.filename);
				}
				// 새로운 이미지로 교체
				board.images = images;
			}

			// updateBoardDto.content가 존재하면 AES 암호화하여 저장
			if (updateBoardDto.content) {
				updateBoardDto.content = encryptAes(updateBoardDto.content);
			}

			updatedBoard = await manager.save(Board, {
				...board,
				...updateBoardDto,
			});

			updatedBoard.user.password = undefined; // password 제거하여 반환
		});

		return updatedBoard;
	}

	async getIsLiked(id: number, userData: UserDataDto): Promise<boolean> {
		const board: Board = await this.boardRepository.findOneBy({ id });
		if (!board) {
			throw new NotFoundException('board not found');
		}

		// 이미 좋아요를 누른 경우
		if (board.likes.find((user) => user.id === userData.userId)) {
			return true;
		}

		return false;
	}

	async patchLike(id: number, userData: UserDataDto): Promise<Partial<Board>> {
		const board = await this.boardRepository.findOneBy({ id });
		if (!board) {
			throw new NotFoundException('board not found');
		}

		// 이미 좋아요를 누른 경우
		if (board.likes.find((user) => user.id === userData.userId)) {
			throw new BadRequestException('already liked');
		}

		const user = await this.userRepository.findOneBy({ id: userData.userId });
		if (!user) {
			throw new NotFoundException('user not found');
		}

		board.likes.push(user);
		board.like_cnt = board.likes.length;

		const updatedBoard = await this.boardRepository.save(board);

		return { like_cnt: updatedBoard.like_cnt };
	}

	async patchUnlike(
		id: number,
		userData: UserDataDto,
	): Promise<Partial<Board>> {
		const board = await this.boardRepository.findOneBy({ id });
		if (!board) {
			throw new NotFoundException('board not found');
		}

		// 좋아요를 누르지 않은 경우
		if (!board.likes.find((user) => user.id === userData.userId)) {
			throw new BadRequestException('not liked');
		}

		const user = await this.userRepository.findOneBy({ id: userData.userId });
		if (!user) {
			throw new NotFoundException('user not found');
		}

		board.likes = board.likes.filter((user) => user.id !== userData.userId);
		board.like_cnt = board.likes.length;

		const updatedBoard = await this.boardRepository.save(board);
		return { like_cnt: updatedBoard.like_cnt };
	}

	async deleteBoard(id: number, userData: UserDataDto): Promise<DeleteResult> {
		let result: DeleteResult;

		await this.dataSource.transaction(async (manager: EntityManager) => {
			const board: Board = await manager.findOneBy(Board, { id });

			if (!board) {
				throw new NotFoundException('board not found');
			}

			// 게시글 작성자와 삭제 요청자가 다른 경우
			if (board.user.id !== userData.userId) {
				throw new BadRequestException('not your post');
			}

			// 연관된 이미지 삭제
			for (const image of board.images) {
				// 이미지 리포지토리에서 삭제
				await manager.delete(Image, { id: image.id });
				// NCP Object Storage에서 삭제
				await this.fileService.deleteFile(image.filename);
			}

			// 연관된 별 스타일 삭제
			if (board.star) {
				await this.starModel.deleteOne({ _id: board.star });
			}

			// like 조인테이블 레코드들은 자동으로 삭제됨 (외래키 제약조건 ON DELETE CASCADE)

			// 게시글 삭제
			result = await manager.delete(Board, { id });
		});
		return result;
	}
}
