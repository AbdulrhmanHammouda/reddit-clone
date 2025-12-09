import React, { useState } from "react";
import Step1AddTopics from "./Step1AddTopics"; // Assuming Step1AddTopics is in the same folder
import Step2CommunityType from "./Step2CommunityType"; // Assuming Step2CommunityType is in the same folder
import Step3CommunityInfo from "./Step3CommunityInfo"; // Assuming Step3CommunityInfo is in the same folder
import Step4UploadMedia from "./Step4UploadMedia"; // Assuming Step4UploadMedia is in the same folder

const AddCommunityModal = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [topics, setTopics] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(null);
  const [banner, setBanner] = useState(null);

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // Close the modal when clicking outside
  const handleModalClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    isVisible && (
      <div
        className="fixed inset-0 flex justify-center items-center bg-black/50 z-50"
        onClick={handleModalClose} // Close modal when clicking outside
      >
        <div
          className="bg-reddit-card dark:bg-reddit-dark_card rounded-lg p-6 w-[600px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold">Create a Community</h2>
          <p className="mt-2">Follow the steps below to create your community.</p>

          {/* Render Steps */}
          {currentStep === 1 && (
            <Step1AddTopics topics={topics} setTopics={setTopics} handleNext={handleNextStep} />
          )}
          {currentStep === 2 && (
            <Step2CommunityType isPrivate={isPrivate} setIsPrivate={setIsPrivate} />
          )}
          {currentStep === 3 && (
            <Step3CommunityInfo
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
            />
          )}
          {currentStep === 4 && (
            <Step4UploadMedia icon={icon} setIcon={setIcon} banner={banner} setBanner={setBanner} />
          )}

          {/* Navigation Buttons */}
          <div className="mt-4 flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={handlePreviousStep}
                className="bg-reddit-card text-reddit-text px-4 py-2 rounded-md"
              >
                Previous
              </button>
            )}

            <div>
              {currentStep < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="bg-reddit-blue text-white px-4 py-2 rounded-md"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-reddit-blue text-white px-4 py-2 rounded-md"
                >
                  Create Community
                </button>
              )}
            </div>
          </div>

          {/* Close button (X) */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-xl font-semibold"
          >
            ×
          </button>
        </div>
      </div>
    )
  );
};

export default AddCommunityModal;
