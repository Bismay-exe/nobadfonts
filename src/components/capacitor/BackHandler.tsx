import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackHandler() {
    const navigate = useNavigate();
    const location = useLocation();
    const lastBackPress = useRef(0);

    useEffect(() => {
        const listenerPromise = App.addListener("backButton", () => {
            // If not home → go back
            if (location.pathname !== "/") {
                navigate(-1);
                return;
            }

            // Double tap to exit
            const now = Date.now();

            if (now - lastBackPress.current < 2000) {
                App.exitApp();
            } else {
                lastBackPress.current = now;
                showToast("Press back again to exit");
            }
        });

        return () => {
            listenerPromise.then(handle => handle.remove());
        };
    }, [location]);

    return null;
}

function showToast(message: string) {
    const div = document.createElement("div");
    div.innerText = message;

    Object.assign(div.style, {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#000",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        zIndex: "9999",
        fontSize: "14px"
    });

    document.body.appendChild(div);

    setTimeout(() => div.remove(), 1500);
}