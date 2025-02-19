export interface USERS{
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    phone: string;
    confirmation_sent_at: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: AppMetadata;
    user_metadata: UserMetadata;
    identities: null | undefined; 
    created_at: string;
    updated_at: string;
    is_anonymous: boolean;
}

type AppMetadata = {
    provider: string;
    providers: string[];
  };
  
  type UserMetadata = {
    email: string;
    email_verified: boolean;
    first_name: string;
    last_name: string;
    phone_verified: boolean;
    sub: string;
  };