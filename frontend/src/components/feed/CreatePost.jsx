import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPostApi } from '../../services/apiService';
import EmojiPicker from 'emoji-picker-react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { ImageIcon, CloseIcon, EmojiIcon, PollIcon } from '../common/CustomIcons';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { getGradientForUsername } from '../../utils/helpers';

const CreatePost = ({ onPostCreated, showSnackbar }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [category, setCategory] = useState('General');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Poll states and handlers
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);

  const handlePollOptionChange = (index, value) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handleTogglePoll = () => {
    setIsPollActive(prev => !prev);
    if (!isPollActive) {
      handleRemoveImage();
    }
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedText = localStorage.getItem('connecthub_draft_text');
    const savedCategory = localStorage.getItem('connecthub_draft_category');
    if (savedText) {
      setText(savedText);
    }
    if (savedCategory) {
      setCategory(savedCategory);
    }
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    localStorage.setItem('connecthub_draft_text', text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem('connecthub_draft_category', category);
  }, [category]);

  // Warning before leaving with unsaved draft
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (text.trim() || imageFile) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your unsaved post draft will be lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [text, imageFile]);

  const handleEmojiClick = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // Revoke object URL when image preview changes or component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('File size exceeds 5MB limit. Please upload a smaller image.', 'error');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showSnackbar('Only JPEG, PNG, and WEBP formats are supported.', 'error');
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim() && !imageFile && !isPollActive) {
      showSnackbar('Post must contain text, an image, or a poll.', 'warning');
      return;
    }

    if (isPollActive) {
      const activeOptions = pollOptions.filter(o => o.trim() !== '');
      if (activeOptions.length < 2) {
        showSnackbar('A poll must have at least 2 options.', 'warning');
        return;
      }
      if (!text.trim()) {
        showSnackbar('Please write a question or description for your poll in the text field.', 'warning');
        return;
      }
    }

    setSubmitting(true);
    try {
      let pollData = null;
      if (isPollActive) {
        pollData = {
          question: text.trim(),
          options: pollOptions.filter(o => o.trim() !== ''),
        };
      }

      const newPost = await createPostApi(text.trim(), imageFile, category, pollData);
      
      // Notify parent list to insert new post at the top
      onPostCreated(newPost);
      
      // Reset form states
      setText('');
      setCategory('General');
      handleRemoveImage();
      setIsPollActive(false);
      setPollOptions(['', '']);
      
      // Clear draft cache
      localStorage.removeItem('connecthub_draft_text');
      localStorage.removeItem('connecthub_draft_category');
      
      showSnackbar('Post created successfully!', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Failed to create post. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isPostDisabled = isPollActive 
    ? (!text.trim() || pollOptions.filter(o => o.trim() !== '').length < 2)
    : (!text.trim() && !imageFile);

  return (
    <Card sx={{ mb: { xs: 1.5, sm: 3 }, p: { xs: 0.5, sm: 1 }, borderRadius: { xs: 0, sm: '12px' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Avatar
            sx={{
              background: getGradientForUsername(user?.username),
              fontWeight: 700,
              width: 40,
              height: 40,
              border: '1px solid rgba(25, 118, 210, 0.1)',
            }}
          >
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <TextField
              placeholder="What's on your mind?"
              multiline
              rows={3}
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
              aria-label="Post Text"
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 1, mb: 1.5 }}>
              <Typography variant="caption" color={text.length >= 480 ? 'error' : 'text.secondary'} sx={{ fontWeight: 500 }}>
                {text.length} / 500
              </Typography>
            </Box>

            {/* Selected Image Preview Panel */}
            {imagePreview && (
              <Box
                sx={{
                  position: 'relative',
                  mt: 2,
                  mb: 1,
                  borderRadius: 3,
                  overflow: 'hidden',
                  maxHeight: 300,
                  backgroundColor: '#f0f2f5',
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
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
                  <CloseIcon size={16} />
                </IconButton>
              </Box>
            )}

            {/* Poll Builder Panel */}
            {isPollActive && (
              <Box 
                sx={{ 
                  mt: 2, 
                  mb: 2, 
                  p: 2, 
                  borderRadius: '12px', 
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fbfcfd'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PollIcon size={16} /> Poll Options
                  </Typography>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => {
                      setIsPollActive(false);
                      setPollOptions(['', '']);
                    }}
                    sx={{ py: 0.2, px: 1, minWidth: 'auto', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Cancel
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pollOptions.map((opt, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        placeholder={`Option ${idx + 1}`}
                        size="small"
                        fullWidth
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        disabled={submitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            fontSize: '0.85rem'
                          }
                        }}
                        slotProps={{
                          input: {
                            maxLength: 80,
                          }
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemovePollOption(idx)}
                          disabled={submitting}
                        >
                          <CloseIcon size={14} />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
                
                {pollOptions.length < 4 && (
                  <Button
                    size="small"
                    onClick={handleAddPollOption}
                    disabled={submitting}
                    sx={{ mt: 1.5, fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    + Add option
                  </Button>
                )}
              </Box>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 1.5,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                mt: 1,
                gap: 1,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              {/* Media Upload & Emojis & Category select */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  disabled={submitting}
                  id="create-post-image-file"
                />
                <label htmlFor="create-post-image-file">
                  <IconButton
                    color="primary"
                    component="span"
                    disabled={submitting || isPollActive}
                    aria-label="Upload image file"
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      },
                    }}
                  >
                    <ImageIcon size={20} />
                  </IconButton>
                </label>
 
                {/* Emoji Trigger Icon */}
                <IconButton
                  color="primary"
                  onClick={handleEmojiClick}
                  disabled={submitting}
                  aria-label="Add emoji"
                  sx={{
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  <EmojiIcon size={20} />
                </IconButton>

                {/* Poll Trigger Icon */}
                <IconButton
                  color="primary"
                  onClick={handleTogglePoll}
                  disabled={submitting || !!imageFile}
                  aria-label="Create a poll"
                  sx={{
                    backgroundColor: isPollActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(25, 118, 210, 0.04)',
                    '&:hover': {
                      backgroundColor: isPollActive ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  <PollIcon size={20} />
                </IconButton>

                {/* Category select dropdown */}
                <FormControl size="small" variant="outlined" sx={{ minWidth: 110 }}>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Select category' }}
                    sx={{
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      height: 36,
                      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fafbfc',
                      color: 'text.primary',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      },
                      border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <MenuItem value="General" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>General</MenuItem>
                    <MenuItem value="Finance" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Finance</MenuItem>
                    <MenuItem value="Career" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Career</MenuItem>
                    <MenuItem value="Education" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Education</MenuItem>
                    <MenuItem value="Technology" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Technology</MenuItem>
                  </Select>
                </FormControl>

                {/* Emoji Picker Popover */}
                <Popover
                  open={Boolean(emojiAnchorEl)}
                  anchorEl={emojiAnchorEl}
                  onClose={handleEmojiClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <EmojiPicker onEmojiClick={handleEmojiSelect} />
                </Popover>

                {imageFile && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' }, fontWeight: 500 }}
                  >
                    {imageFile.name.length > 15
                      ? `${imageFile.name.substring(0, 12)}...`
                      : imageFile.name}
                  </Typography>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isPostDisabled || submitting}
                sx={{
                  px: { xs: 2, sm: 4 },
                  borderRadius: '8px',
                  fontWeight: 600,
                  minWidth: { xs: 'auto', sm: 120 },
                  flexShrink: 0,
                }}
              >
                {submitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} color="inherit" />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>Posting...</Typography>
                  </Box>
                ) : (
                  'Post'
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
