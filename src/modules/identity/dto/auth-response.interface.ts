export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phoneNumber: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    status: string;
    isVerified: boolean;
  };
  devOtp?: string;
}

export interface OtpResponse {
  message: string;
  phoneNumber: string;
  expiresIn: number;
  devOtp?: string;
}
