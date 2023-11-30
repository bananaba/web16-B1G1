import instance from 'shared/apis/AxiosInterceptor';
import { BASE_URL } from '@constants';

const dummyStarData = {
	color: 'pink',
	size: 200,
	position: {
		x: 1000,
		y: 7000,
		z: -1600,
	},
}; // TODO: 별 커스텀 데이터로 변경

export const sendPost = async (text: string, files: FileList | null) => {
	try {
		const formData = new FormData();
		formData.append('title', '제목');
		formData.append('content', text);
		formData.append('star', JSON.stringify(dummyStarData));
		if (files) {
			for (let i = 0; i < files.length; i++) formData.append('file', files[i]);
		}

		const response = await instance.post(`${BASE_URL}post`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});

		return response;
	} catch (err) {
		console.error(err);
	}
};
