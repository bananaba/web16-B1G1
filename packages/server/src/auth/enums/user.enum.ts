export enum UserEnum {
	MIN_USERNAME_LENGTH = 4,
	MAX_USERNAME_LENGTH = 50,
	MIN_PASSWORD_LENGTH = 8,
	MAX_PASSWORD_LENGTH = 100,
	MIN_NICKNAME_LENGTH = 2,
	MAX_NICKNAME_LENGTH = 50,

	USERNAME_NOTEMPTY_MESSAGE = '아이디는 필수 입력값입니다.',
	PASSWORD_NOTEMPTY_MESSAGE = '비밀번호는 필수 입력값입니다.',
	NICKNAME_NOTEMPTY_MESSAGE = '닉네임은 필수 입력값입니다.',

	USERNAME_ISSTRING_MESSAGE = '아이디는 문자열이어야 합니다.',
	PASSWORD_ISSTRING_MESSAGE = '비밀번호는 문자열이어야 합니다.',
	NICKNAME_ISSTRING_MESSAGE = '닉네임은 문자열이어야 합니다.',

	VIOLATE_USERNAME_MESSAGE = `아이디는 영문자와 숫자로 이루어진 ${MIN_USERNAME_LENGTH}~${MAX_USERNAME_LENGTH}자여야 합니다.`,
	VIOLATE_PASSWORD_MESSAGE = `비밀번호는 ${MIN_PASSWORD_LENGTH}~${MAX_PASSWORD_LENGTH}자여야 합니다.`,
	VIOLATE_NICKNAME_MESSAGE = `닉네임은 영문자, 숫자, 한글로 이루어진 ${MIN_NICKNAME_LENGTH}~${MAX_NICKNAME_LENGTH}자여야 합니다.`,

	NOT_EXIST_USERNAME_MESSAGE = '아이디에 해당하는 회원이 존재하지 않습니다.',
	UNCORRECT_PASSWORD_MESSAGE = '비밀번호가 일치하지 않습니다.',

	SUCCESS_SIGNOUT_MESSAGE = '로그아웃에 성공했습니다.',
}

export enum UserShareStatus {
	PUBLIC = 'public',
	PRIVATE = 'private',
}
