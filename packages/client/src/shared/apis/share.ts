import instance from './AxiosInterceptor';

export const getShareLink = async (nickName: string) => {
	const { data } = await instance({
		method: 'GET',
		url: `/auth/sharelink?nickname=${nickName}`,
	});

	return data;
};

export const patchShareStatus = async (status: 'private' | 'public') => {
	const { data } = await instance({
		method: 'PATCH',
		url: `/auth/status`,
		data: {
			status,
		},
	});

	return data;
};
