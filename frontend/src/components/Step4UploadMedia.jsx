import React from "react";

const Step4UploadMedia = ({ icon, setIcon, banner, setBanner }) => {
  return (
    <div>
      <div className="mt-4">
        <button className="bg-reddit-card p-3" onClick={() => document.getElementById("icon-upload").click()}>
          Upload Icon
        </button>
        <input
          id="icon-upload"
          type="file"
          onChange={(e) => setIcon(e.target.files[0])}
          className="hidden"
        />
        {icon && <div>{icon.name}</div>}
      </div>
      <div className="mt-4">
        <button className="bg-reddit-card p-3" onClick={() => document.getElementById("banner-upload").click()}>
          Upload Banner
        </button>
        <input
          id="banner-upload"
          type="file"
          onChange={(e) => setBanner(e.target.files[0])}
          className="hidden"
        />
        {banner && <div>{banner.name}</div>}
      </div>
    </div>
  );
};

export default Step4UploadMedia;
