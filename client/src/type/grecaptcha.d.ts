export { };

declare global {
    interface Window {
        grecaptcha: {
            getResponse: () => string;
            reset: () => void;
            render: (container: string | HTMLElement, params: {
                sitekey: string;
            }) => number;
        };
    }
}
