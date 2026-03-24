import api from './AxiosInstance';

export const userApi = {
    // 회원가입
    signUp: (formData) => api.post('/api/users/signup', formData),
    
    // 아이디 중복 체크
    checkId: (userId) => api.get(`/api/users/check-id/${userId}`),

    // 닉네임 중복 체크
    checkNickname: (nickname) => api.get('/api/users/check-nickname', { params: { nickname } }),

    // 이메일 중복 체크
    checkEmail: (email) => api.get('/api/users/check-email', { params: { email } }),
    
    // 로그인
    login: (credentials) => api.post('/api/users/login', credentials),
    logout: () => api.post('/api/users/logout'),
    getMyProfile: () => api.get('/api/users/me'),
    updateMyProfile: (payload) => api.patch('/api/users/me', payload),
    withdrawMe: () => api.delete('/api/users/me'),

    // 아이디 찾기
    findId: (payload) => api.post('/api/users/find-id', payload),

    // 비밀번호 찾기
    findPassword: (payload) => api.post('/api/users/find-password', payload),
};
