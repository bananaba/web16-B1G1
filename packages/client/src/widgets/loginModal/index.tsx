import { Modal } from 'shared/ui';
import { TopButton, LeftButton, RightButton, LoginContent } from './ui';
import { useLoginStore } from 'shared/store/userLoginStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '@constants';
import Cookie from 'js-cookie';

axios.defaults.withCredentials = true;

export default function LoginModal() {
	const { id, password, setPassword } = useLoginStore();
	const navigate = useNavigate();

	const handleLoginSubmit = () => {
		if (id.length && password.length === 0) return;
		const data = {
			username: id,
			password: password,
		};
		setPassword('');
		axios
			.post(BASE_URL + 'auth/signin', data, {
				withCredentials: true,
			})
			.then((res) => {
				if (res.status === 200) {
					Cookie.set('accessToken', res.data.accessToken);
					Cookie.set('refreshToken', res.data.refreshToken);
					navigate('/home');
				} else console.log(res.status);
			});
	};
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				handleLoginSubmit();
			}}
		>
			<Modal
				title="로그인"
				topButton={<TopButton onClick={() => navigate('/')} />}
				rightButton={<RightButton />}
				leftButton={<LeftButton onClick={() => navigate('/signup')} />}
				onClickGoBack={() => navigate('/')}
				style={{ width: '516px' }}
			>
				<LoginContent />
			</Modal>
		</form>
	);
}
