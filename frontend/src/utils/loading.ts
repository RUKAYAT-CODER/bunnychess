import { ElLoading } from 'element-plus';

export interface LoadingOptions {
    text?: string;
    background?: string;
    spinner?: string;
    fullscreen?: boolean;
    target?: string | HTMLElement;
}

export class LoadingManager {
    private static loadingInstance: any = null;
    private static loadingCount = 0;

    /**
     * Show loading indicator
     */
    static show(options: LoadingOptions = {}): void {
        if (this.loadingCount === 0) {
            this.loadingInstance = ElLoading.service({
                text: options.text || 'Loading...',
                background: options.background || 'rgba(0, 0, 0, 0.7)',
                spinner: options.spinner || 'el-icon-loading',
                fullscreen: options.fullscreen !== false,
                target: options.target,
            });
        }
        this.loadingCount++;
    }

    /**
     * Hide loading indicator
     */
    static hide(): void {
        this.loadingCount = Math.max(0, this.loadingCount - 1);

        if (this.loadingCount === 0 && this.loadingInstance) {
            this.loadingInstance.close();
            this.loadingInstance = null;
        }
    }

    /**
     * Force hide all loading indicators
     */
    static forceHide(): void {
        if (this.loadingInstance) {
            this.loadingInstance.close();
            this.loadingInstance = null;
        }
        this.loadingCount = 0;
    }

    /**
     * Show loading with promise
     */
    static async withLoading<T>(
        promise: Promise<T>,
        options: LoadingOptions = {}
    ): Promise<T> {
        this.show(options);
        try {
            const result = await promise;
            return result;
        } finally {
            this.hide();
        }
    }

    /**
     * Show loading for a specific duration
     */
    static showForDuration(duration: number, options: LoadingOptions = {}): void {
        this.show(options);
        setTimeout(() => {
            this.hide();
        }, duration);
    }
}

// Loading states for different operations
export const LoadingStates = {
    AUTHENTICATION: { text: 'Authenticating...' },
    GAME_LOADING: { text: 'Loading game...' },
    MOVE_PROCESSING: { text: 'Processing move...' },
    MATCHMAKING: { text: 'Finding opponent...' },
    CONNECTION: { text: 'Connecting...' },
    SAVING: { text: 'Saving...' },
    UPLOADING: { text: 'Uploading...' },
    DOWNLOADING: { text: 'Downloading...' },
    PROCESSING: { text: 'Processing...' },
} as const; 