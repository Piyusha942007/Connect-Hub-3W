import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updatePostApi } from '../../services/apiService';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

const EditPostDialog = ({ open, onClose, post, onPostUpdated, showSnackbar }) => {
  const { user } = useAuth();
  
  // State variables hydrated with post properties
  const [text, setText] = useState(post.text || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [category, setCategory] = useState(post.category || 'General');
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  // Compute full API URL for existing image
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}${imagePath}`;
  }, []);

  // Initialize and check post properties on dialog open
  useEffect(() => {
    if (open) {
      setText(post.text || '');
      setImageFile(null);
      setRemoveImage(false);
      setCategory(post.category || 'General');
      setImagePreview(post.image ? getImageUrl(post.image) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Only revoke temporary object URLs, not server strings
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Enforce 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('File size exceeds 5MB limit.', 'error');
        return;
      }

      // Enforce file types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showSnackbar('Only JPEG, PNG, and WEBP formats are supported.', 'error');
        return;
      }

      // Revoke old object URL if exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setRemoveImage(false); // New image overrides removal flag
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setRemoveImage(true); // Flag to delete image on server
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const willHaveText = text.trim();
    const willHaveImage = imageFile ? true : (removeImage ? false : !!post.image);

    if (!willHaveText && !willHaveImage) {
      showSnackbar('Post must contain at least text or an image.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const updatedPost = await updatePostApi(post._id, text.trim(), imageFile, removeImage, category);
      onPostUpdated(updatedPost);
      showSnackbar('Post updated successfully!', 'success');
      onClose();
    } catch (err) {
      showSnackbar(err.message || 'Failed to update post.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? null : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
        <span>Edit Post</span>
        <IconButton onClick={onClose} disabled={submitting} size="small" aria-label="Close dialog">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              placeholder="Update your thoughts..."
              multiline
              rows={4}
              fullWidth
              variant="standard"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              disabled={submitting}
              slotProps={{
                input: {
                  disableUnderline: true,
                  style: { fontSize: '1rem', lineHeight: '1.5' },
                },
              }}
              sx={{ mb: 0.5 }}
              aria-label="Edit Post Text"
              autoFocus
            />

            {/* Character Counter */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
              <Typography variant="caption" color={text.length >= 480 ? 'error' : 'text.secondary'} sx={{ fontWeight: 500 }}>
                {text.length} / 500
              </Typography>
            </Box>

            {/* Image Preview / Replacement Container */}
            {imagePreview && (
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 3,
                  overflow: 'hidden',
                  maxHeight: 250,
                  backgroundColor: '#f0f2f5',
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <img
                  src={imagePreview}
                  alt="Post preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 250,
                    objectFit: 'contain',
                  }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  disabled={submitting}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                    width: 28,
                    height: 28,
                  }}
                  size="small"
                  aria-label="Remove image"
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}

            {/* Media Trigger & Category */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  disabled={submitting}
                  id="edit-post-image-file"
                />
                <label htmlFor="edit-post-image-file">
                  <IconButton
                    color="primary"
                    component="span"
                    disabled={submitting}
                    aria-label="Change image file"
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      },
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 500 }}>
                  {imageFile ? `New: ${imageFile.name.substring(0, 12)}...` : (post.image && !removeImage ? 'Change shared photo' : 'Attach photo')}
                </Typography>
              </Box>

              {/* Category select dropdown */}
              <FormControl size="small" variant="outlined" sx={{ minWidth: 110 }}>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                  displayEmpty
                  inputProps={{ 'aria-label': 'Select category' }}
                  sx={{
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    height: 36,
                    backgroundColor: '#fafbfc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    },
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <MenuItem value="General" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>General</MenuItem>
                  <MenuItem value="Finance" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Finance</MenuItem>
                  <MenuItem value="Career" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Career</MenuItem>
                  <MenuItem value="Education" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Education</MenuItem>
                  <MenuItem value="Technology" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Technology</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={submitting} sx={{ px: 3, borderRadius: 5 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || (text.trim() === (post.text || '') && !imageFile && !removeImage && category === (post.category || 'General'))}
          sx={{ px: 3, borderRadius: 5, minWidth: 100 }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostDialog;
