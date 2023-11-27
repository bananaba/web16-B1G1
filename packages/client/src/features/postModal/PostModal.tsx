import { useViewStore } from 'shared/store/useViewStore';
import { Button, Modal, ModalPortal } from 'shared/ui';
import { PostData } from 'shared/lib/types/post';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled from '@emotion/styled';

interface PropsType {
	data: PostData;
}

export default function PostModal({ data }: PropsType) {
	const { setView } = useViewStore();
	return (
		<ModalPortal>
			<PostModalLayout
				title={data.title}
				rightButton={rightButton}
				onClickGoBack={() => {
					setView('DETAIL');
				}}
			>
				<ImageContainer>
					<Image
						src={
							data.images[0]
							// TODO: 여러 이미지 출력할 수 있는 Carousel 구현
						}
						alt="img"
					/>
				</ImageContainer>
				<TextContainer>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{data.content}
					</ReactMarkdown>
				</TextContainer>
			</PostModalLayout>
		</ModalPortal>
	);
}

const rightButton = (
	<Button
		size="m"
		buttonType={'warning-border'}
		onClick={() => {
			console.log('삭제');
		}} // TODO: 삭제 기능 구현
	>
		삭제
	</Button>
);

const PostModalLayout = styled(Modal)`
	transform: translate(-10%, -50%);
`;

const TextContainer = styled.div`
	overflow-y: auto;
	width: 807px;

	${({ theme: { colors } }) => ({
		color: colors.text.secondary,
	})}
`;

const ImageContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 26px;
`;

const Image = styled.img`
	width: 649px;
`;
