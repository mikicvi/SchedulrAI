import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { ToastActionElement } from '@/components/ui/toast';

export function useNotificationToast() {
	const originalToast = useToast();
	const { addNotification } = useUser();

	const showToast = (props: {
		title: string;
		description?: string;
		variant?: 'default' | 'destructive';
		type?: 'info' | 'success' | 'warning' | 'error' | 'event';
		action?: ToastActionElement;
	}) => {
		// Store in notifications
		addNotification({
			title: props.title,
			message: props.description || '',
			type: props.type || (props.variant === 'destructive' ? 'error' : 'info'),
		});

		// Show toast
		return originalToast.toast({
			title: props.title,
			description: props.description,
			variant: props.variant,
			action: props.action,
		});
	};

	return { toast: showToast };
}
