import React from "react";

const Step2CommunityType = ({ isPrivate, setIsPrivate }) => {
  return (
    <div>
      <label className="block text-sm font-medium">Community Type</label>
      <div className="mt-1 flex gap-4">
        <label>
          <input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} />
          Public
        </label>
        <label>
          <input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} />
          Private
        </label>
      </div>
    </div>
  );
};

export default Step2CommunityType;
