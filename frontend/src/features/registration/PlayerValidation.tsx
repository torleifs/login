import * as yup from 'yup';

export const playerSchema = yup.object().shape({
  name: yup.string().required(),
  email: yup.string().email().required(),
});