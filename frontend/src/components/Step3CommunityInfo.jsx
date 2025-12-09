import React from "react";

const Step3CommunityInfo = ({ name, setName, description, setDescription }) => {
  return (
    <div>
      <div>
        <label className="block text-sm font-medium">Community Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-md"
        />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-md"
        />
      </div>
    </div>
  );
};

export default Step3CommunityInfo;
