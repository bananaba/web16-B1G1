import LandingScreen from 'widgets/landingScreen';
import LoginModal from 'widgets/loginModal';
import LogoAndStart from 'widgets/logoAndStart';
import SignUpModal from 'widgets/signupModal/SignUpModal';
import { useReducer } from 'react';

function pageReducer(state: number, action: { type: 'NEXT' | 'PREV' }) {
	switch (action.type) {
		case 'NEXT':
			return state + 1;
		case 'PREV':
			return state - 1;
		default:
			return state;
	}
}

export default function Landing() {
	const [page, dispatch] = useReducer(pageReducer, 0);
	return (
		<>
			{page === 0 && <LogoAndStart changePage={dispatch} />}
			{page === 1 && <LoginModal changePage={dispatch} />}
			{page === 2 && <SignUpModal changePage={dispatch} />}
			<LandingScreen />
		</>
	);
}
