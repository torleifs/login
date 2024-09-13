import { useEffect, useRef } from "react";
import styles from './modal.module.css';

type LostModalProps = {
  title: string;
  children: React.ReactNode;
  isActive?: boolean;
};


const LostModal = ({title, isActive, children}:LostModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
 
  useEffect(() => {
    if (isActive) {
      dialogRef?.current?.showModal();
    } else if (dialogRef?.current?.open) {
      dialogRef.current.close();
    }
  }, [isActive]);
  
  
  return (
    <dialog ref={dialogRef} className={styles.modal}>
      {title}
      {children}
    </dialog>
  );
}

export default LostModal;