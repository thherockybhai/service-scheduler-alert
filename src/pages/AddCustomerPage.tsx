
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { Navbar } from "@/components/Navbar";

const AddCustomerPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 container py-8 max-w-3xl">
        <AddCustomerForm />
      </div>
    </div>
  );
};

export default AddCustomerPage;
