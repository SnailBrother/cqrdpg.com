import { useState } from 'react';

export const useForm = (initialValues = {}, validateFn) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field on blur if validate function provided
    if (validateFn) {
      const fieldErrors = validateFn(values);
      if (fieldErrors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: fieldErrors[field]
        }));
      }
    }
  };

  const validate = () => {
    if (validateFn) {
      const newErrors = validateFn(values);
      setErrors(newErrors);
      setTouched(Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}));
      
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues
  };
};