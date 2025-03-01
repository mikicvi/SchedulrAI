export const playNotificationSound = () => {
	const audio = new Audio('/notification-beep.mp3');
	audio.volume = 0.5;
	audio.play().catch((e) => console.log('Audio play failed:', e));
};
