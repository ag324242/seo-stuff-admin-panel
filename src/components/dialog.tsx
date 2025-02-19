import supabaseServerClient from "@/app-kit/supabase/supabaseService";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

interface EditCreditsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string; email: string; credits: number };
  onUpdate: Function;
}

const EditCreditsDialog = ({ isOpen, onClose, user,onUpdate }: EditCreditsDialogProps) => {
  const [credits, setCredits] = useState(user.credits);

  useEffect(() => {
    if (user) {
        setCredits(user.credits); 
    }
}, [user]);

const handleUpdateCredit = async () => {
        if (credits === user.credits) {
            console.log("No change in credits, skipping update.");
            return;
        }
        const creditDifference = credits - user.credits;

        if(creditDifference > 0){
            const { error } = await supabaseServerClient
            .from("credits")
            .insert([
                {
                    user_id: user.id,
                    credits: creditDifference, 
                    reason: "Added by admin",
                },
            ]);
            toast.success("User credit added successfully!");
        if (error) {
            console.error("Error adding credits:", error);
            return;
        }
        } else {
            const { error } = await supabaseServerClient
            .from("reports")
            .insert([
                {
                    user_id: user.id,
                    credits: Math.abs(creditDifference), 
                    status: "completed",
                    type: "deducted by admin"
                },
            ]);
            toast.success("User credit deducted successfully!");
        if (error) {
            console.error("Error logging credit usage:", error);
            return;
        }
        }
        onUpdate(user.id, credits);
        onClose();
};

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black bg-opacity-50" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl w-96 p-6">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-lg font-bold">Edit Credits</Dialog.Title>
              <FiX
                className="cursor-pointer text-gray-500"
                size={20}
                onClick={onClose}
              />
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600">User Name: <strong>{user.name}</strong></p>
              <p className="text-sm text-gray-600">User Email: <strong>{user.email}</strong></p>
              <label className="block mt-4 mb-2">Credits:</label>
              <input
                type="text"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={onClose}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded" onClick={handleUpdateCredit} >
                Update
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditCreditsDialog;
