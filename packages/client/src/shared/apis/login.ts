import axios, { AxiosError } from 'axios';
import { BASE_URL } from '@constants';
import Cookies from 'js-cookie';
import { NavigateFunction } from 'react-router-dom';
import { useLoadingStore } from 'shared/store/useLoadingStore';

axios.defaults.withCredentials = true;

export const postLogin = async (
	data: {
		username: string;
		password: string;
	},
	setIdState: React.Dispatch<React.SetStateAction<boolean>>,
	setPasswordState: React.Dispatch<React.SetStateAction<boolean>>,
	navigate: NavigateFunction,
) => {
	try {
		const res = await axios.post(BASE_URL + 'auth/signin', data, {
			withCredentials: true,
		});

		Cookies.set('userId', data.username, { path: '/', expires: 7 });
		Cookies.set('refreshToken', res.data.refreshToken, {
			path: '/',
			secure: true,
			expires: 1,
		});
		Cookies.set('accessToken', res.data.accessToken, {
			path: '/',
			secure: true,
			expires: 1 / 24,
		});
		navigate('/home');
		useLoadingStore.setState({
			isLoading: true,
		});

		setTimeout(() => {
			useLoadingStore.setState({
				isLoading: false,
			});
		}, 5500);
	} catch (err) {
		if (err instanceof AxiosError) {
			if (err.response?.status === 404) setIdState(false);
			else if (err.response?.status === 401) setPasswordState(false);
			else alert(err);
		} else alert(err);
	}
};
