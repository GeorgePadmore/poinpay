export const SignupSchema = {
    body: {
      type: 'object',
      required: ['name', 'username', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 200 },
        username: { type: 'string', minLength: 4, maxLength: 200 },
        email: { type: 'string', format: 'email', minLength: 4, maxLength: 255 },
        password: { type: 'string', minLength: 8, maxLength: 255 }, // Add more validation rules as needed
      },
    },
};