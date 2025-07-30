import { ElMessage } from 'element-plus';

export interface ApiError {
    statusCode: number;
    message: string;
    error: string;
    code?: string;
    details?: any;
    timestamp: string;
}

export class ErrorHandler {
    /**
     * Handle API errors and show appropriate user messages
     */
    static handleApiError(error: any): void {
        let message = 'An unexpected error occurred';
        let type: 'error' | 'warning' | 'info' = 'error';

        if (error.response?.data) {
            const apiError = error.response.data as ApiError;
            message = apiError.message || 'Request failed';

            // Handle specific error types
            switch (apiError.statusCode) {
                case 400:
                    message = 'Invalid request. Please check your input.';
                    break;
                case 401:
                    message = 'Please log in to continue.';
                    type = 'warning';
                    break;
                case 403:
                    message = 'You do not have permission to perform this action.';
                    break;
                case 404:
                    message = 'The requested resource was not found.';
                    break;
                case 429:
                    message = 'Too many requests. Please try again later.';
                    type = 'warning';
                    break;
                case 500:
                    message = 'Server error. Please try again later.';
                    break;
                default:
                    message = apiError.message || 'An error occurred';
            }
        } else if (error.message) {
            message = error.message;
        }

        ElMessage({
            message,
            type,
            duration: 5000,
            showClose: true,
        });

        // Log error for debugging
        console.error('API Error:', error);
    }

    /**
     * Handle network errors
     */
    static handleNetworkError(error: any): void {
        let message = 'Network error. Please check your connection.';

        if (error.code === 'ECONNABORTED') {
            message = 'Request timeout. Please try again.';
        } else if (error.code === 'NETWORK_ERROR') {
            message = 'Network error. Please check your internet connection.';
        }

        ElMessage({
            message,
            type: 'error',
            duration: 5000,
            showClose: true,
        });

        console.error('Network Error:', error);
    }

    /**
     * Handle validation errors
     */
    static handleValidationError(errors: any[]): void {
        const messages = errors.map(error => error.message || 'Validation error').join(', ');

        ElMessage({
            message: `Validation failed: ${messages}`,
            type: 'error',
            duration: 5000,
            showClose: true,
        });
    }

    /**
     * Handle WebSocket errors
     */
    static handleWebSocketError(error: any): void {
        let message = 'Connection error. Please refresh the page.';

        if (error.type === 'disconnect') {
            message = 'Connection lost. Attempting to reconnect...';
        } else if (error.type === 'reconnect_failed') {
            message = 'Failed to reconnect. Please refresh the page.';
        }

        ElMessage({
            message,
            type: 'warning',
            duration: 3000,
            showClose: true,
        });

        console.error('WebSocket Error:', error);
    }

    /**
     * Handle game-specific errors
     */
    static handleGameError(error: any): void {
        let message = 'Game error occurred.';

        if (error.code === 'INVALID_MOVE') {
            message = 'Invalid move. Please try again.';
        } else if (error.code === 'GAME_NOT_FOUND') {
            message = 'Game not found. Please return to the lobby.';
        } else if (error.code === 'GAME_OVER') {
            message = 'Game has ended.';
        } else if (error.code === 'WRONG_TURN') {
            message = 'Not your turn.';
        }

        ElMessage({
            message,
            type: 'warning',
            duration: 3000,
            showClose: true,
        });

        console.error('Game Error:', error);
    }

    /**
     * Show success message
     */
    static showSuccess(message: string): void {
        ElMessage({
            message,
            type: 'success',
            duration: 3000,
            showClose: true,
        });
    }

    /**
     * Show info message
     */
    static showInfo(message: string): void {
        ElMessage({
            message,
            type: 'info',
            duration: 3000,
            showClose: true,
        });
    }

    /**
     * Show warning message
     */
    static showWarning(message: string): void {
        ElMessage({
            message,
            type: 'warning',
            duration: 4000,
            showClose: true,
        });
    }
} 