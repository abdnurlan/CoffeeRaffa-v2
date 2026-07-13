import React, { useState } from "react";
import styles from "./WatchVideo.module.css";
import { MdPlayCircleOutline } from "react-icons/md";

const WatchVideo = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <div className={styles.bg}>
      <div className={styles.black_bg}>
        <div className="container">
          <div className={styles.video_container}>
            <h2>Kofelərimizi necə hazırlayırıq?</h2>
            <h2>Videonu İzlə</h2>
            <div className={styles.play_button} onClick={handleModalOpen}>
              <MdPlayCircleOutline />
            </div>
            {modalOpen && (
              <div className={styles.modal_bg} onClick={handleModalClose}>
                <div className={styles.modal_content}>
                  <span className={styles.close} onClick={handleModalClose}>
                    &times;
                  </span>
                  <div className={styles.video_wrapper}>
                    <iframe
                      className={styles.video}
                      src="https://www.youtube.com/embed/ry55AZ5TRC4?si=whEJ9mMz2w2TBwt2"
                      title="YouTube video player"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerpolicy="strict-origin-when-cross-origin"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchVideo;
