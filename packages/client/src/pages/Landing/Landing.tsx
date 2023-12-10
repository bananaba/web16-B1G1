import LandingScreen from 'widgets/landingScreen/LandingScreen';
import { useState } from 'react';
import { useToastStore } from 'shared/store/useToastStore';
import { Toast } from 'shared/ui';
import { Outlet } from 'react-router-dom';

export default function Landing() {
	const [mouse, setMouse] = useState([0.5, 0.5]);
	const { text, type } = useToastStore();

	return (
		<div
			onMouseMove={(e) => {
				setMouse([
					e.clientX / window.innerWidth,
					e.clientY / window.innerHeight,
				]);
			}}
		>
			{text && <Toast type={type}>{text}</Toast>}
			<Outlet />
			<LandingScreen mousePosition={mouse} />
		</div>
	);
}
