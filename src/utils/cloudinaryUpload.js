// src/utils/cloudinaryUpload.js
// ⚠️ Replace CLOUD_NAME and UPLOAD_PRESET with your Cloudinary credentials
// Setup: Cloudinary Dashboard → Settings → Upload → Add upload preset (unsigned)

const CLOUD_NAME = 'dxhfykwlh';
const UPLOAD_PRESET = 'rk-fitness-upload'; // unsigned preset

export const uploadToCloudinary = async (file, folder = 'rk-fitness') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
