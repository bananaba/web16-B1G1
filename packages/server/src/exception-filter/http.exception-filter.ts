import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exception } from './exception.schema';

@Catch(HttpException)
export class HttpExceptionFilter {
	constructor(
		@InjectModel(Exception.name)
		private readonly exceptionModel: Model<Exception>,
	) {}

	catch(exception: HttpException, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const request = context.getRequest();
		const response = context.getResponse();
		const method = request.method;
		const status = exception.getStatus();

		const now = new Date();
		const korTime = new Date(now.getTime() + 9 * 3600 * 1000);
		const exceptionData = {
			path: `${method} ${request.url}`,
			error: `${status} ${exception.name}`,
			message: exception.message,
			timestamp: korTime,
		};
		const saveException = new this.exceptionModel(exceptionData);
		saveException.save();

		response.status(status).json(exceptionData);
	}
}
