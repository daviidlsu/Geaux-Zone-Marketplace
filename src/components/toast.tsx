import { ToastContainer, Zoom } from 'react-toastify';

export default function CustomToastContainer() {
    return (
        <ToastContainer
              toastStyle={{ backgroundColor: '#421168ff', color: '#fff', border: '1.5px #421168ff' , borderRadius: '16px'}}
              position="top-right"
              autoClose={4000}
              closeOnClick
              hideProgressBar={true}
              transition={Zoom}
              theme="dark"
        />
    );
}