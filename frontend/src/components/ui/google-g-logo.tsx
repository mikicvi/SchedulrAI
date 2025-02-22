import G_logo from '../../assets/Google_G_logo.svg';

interface GoogleGLogoProps {
	className?: string;
}

export function GoogleGLogo({ className = '' }: GoogleGLogoProps) {
	return <img src={G_logo} alt='Google G Logo' className={`w-6 h-6 ${className}`} />;
}
