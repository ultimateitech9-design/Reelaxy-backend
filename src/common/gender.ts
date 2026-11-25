const FEMALE = ['female', 'woman', 'women', 'girl', 'ladies', 'f'];
const MALE = ['male', 'man', 'men', 'boy', 'm'];

export function isFemaleGender(gender?: string | null) {
  return FEMALE.includes(String(gender || '').trim().toLowerCase());
}

export function hasGender(gender?: string | null) {
  const value = String(gender || '').trim().toLowerCase();
  return FEMALE.includes(value) || MALE.includes(value) || value === 'non-binary';
}
