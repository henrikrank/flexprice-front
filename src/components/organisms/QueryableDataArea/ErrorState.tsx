import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface ErrorStateProps {
	error: any;
	onError?: (error: any) => void;
}

const ErrorState = ({ error, onError }: ErrorStateProps) => {
	useEffect(() => {
		const errorMessage = error as any;
		const message = errorMessage?.error?.message || 'Error fetching data';
		toast.error(message);

		if (onError) {
			onError(error);
		}
	}, [error, onError]);

	return (
		<div className='flex justify-center items-center min-h-[200px]'>
			<div>Error fetching data</div>
		</div>
	);
};

export default ErrorState;
