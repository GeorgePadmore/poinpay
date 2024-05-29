export const LoginSchema = {
    body: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string', minLength: 4, maxLength: 200 },
        password: { type: 'string', minLength: 8, maxLength: 255 }, // Add more validation rules as needed
      },
    },
};