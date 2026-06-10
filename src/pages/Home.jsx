import { useNavigate } from "react-router-dom";

function PatientForm() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // yaha future me ML API call aayega

    navigate("/dashboard");  
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit">Submit</button>
    </form>
  );
}

export default PatientForm;