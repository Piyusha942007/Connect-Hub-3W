import React, { useEffect, useState, useCallback } from 'react';
import { useFeed } from '../hooks/useFeed';
import Navbar from '../components/common/Navbar';
import CreatePost from '../components/feed/CreatePost';
import FeedList from '../components/feed/FeedList';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { LikeIcon, CommentIcon, ClockIcon } from '../components/common/CustomIcons';

const Home = () => {
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    selectedCategory,
    newPostsCount,
    searchQuery,
    sortBy,
    loadInitialFeed,
    loadNextPage,
    addPostLocally,
    updateLikesOptimistically,
    commitLikes,
    addCommentOptimistically,
    commitComments,
    addReplyOptimistically,
    updatePostLocally,
    deletePostLocally,
    changeCategory,
    changeSearchQuery,
    changeSortBy,
  } = useFeed();

  // Scroll to top FAB visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0 = All Posts, 1 = Featured Promotions

  // Snackbar notifications state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'info' | 'warning' | 'error'
  });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Fetch initial feed on mount
  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  // Feed pagination trigger
  const handleLoadMore = useCallback(() => {
    loadNextPage();
  }, [loadNextPage]);

  // Handle optimistic and commit updates for Likes
  const handleLikeToggle = useCallback(
    (postId, payload, isOptimistic = false) => {
      if (isOptimistic) {
        return updateLikesOptimistically(postId, payload.userId, payload.username);
      } else {
        commitLikes(postId, payload);
      }
    },
    [updateLikesOptimistically, commitLikes]
  );

  // Handle optimistic and commit updates for Comments
  const handleCommentAdded = useCallback(
    (postId, payload, isOptimistic = false) => {
      if (isOptimistic) {
        return addCommentOptimistically(postId, payload);
      } else {
        commitComments(postId, payload);
      }
    },
    [addCommentOptimistically, commitComments]
  );

  // Handle optimistic and commit updates for Comment Replies
  const handleReplyAdded = useCallback(
    (postId, commentId, payload, isOptimistic = false) => {
      if (isOptimistic) {
        return addReplyOptimistically(postId, commentId, payload);
      } else {
        commitComments(postId, payload);
      }
    },
    [addReplyOptimistically, commitComments]
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter posts based on current tab selection
  const displayedPosts = currentTab === 1
    ? posts.filter((post) => post.isPromoted)
    : posts;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', pb: 6 }}>
      {/* Top Navigation Bar with search bound to feed */}
      <Navbar searchQuery={searchQuery} onSearchChange={changeSearchQuery} />

      <Container maxWidth="sm" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Global Error Banner */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Create Post Component */}
        <CreatePost onPostCreated={addPostLocally} showSnackbar={showSnackbar} />

        {/* Feed Tab Toggle (All vs Promotions/Featured Only) */}
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          sx={{
            mb: 2.5,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.9rem',
              color: 'text.secondary',
            },
            '& .Mui-selected': {
              color: 'primary.main',
            }
          }}
        >
          <Tab label="📱 All Posts" />
          <Tab label="📢 Promotions" />
        </Tabs>

        {/* Sorting & Filter Category Chips */}
        <Box sx={{ mb: 2.5 }}>
          {/* Categories */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 1.5,
              mb: 1.5,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {['All', 'General', 'Finance', 'Career', 'Education', 'Technology'].map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                color={selectedCategory === cat ? 'primary' : 'default'}
                variant={selectedCategory === cat ? 'filled' : 'outlined'}
                onClick={() => changeCategory(cat)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  borderRadius: 4,
                  px: 1,
                  backgroundColor: selectedCategory === cat ? 'primary.main' : 'background.paper',
                  border: selectedCategory === cat ? 'none' : '1px solid rgba(0,0,0,0.08)',
                  '&:hover': {
                    backgroundColor: selectedCategory === cat ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                  },
                }}
              />
            ))}
          </Box>

          {/* Sort selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sort:
            </Typography>
            {[
              { label: 'Latest', value: 'latest', icon: <ClockIcon size={12} /> },
              { label: 'Likes', value: 'likes', icon: <LikeIcon style={{ width: 12, height: 12 }} /> },
              { label: 'Comments', value: 'comments', icon: <CommentIcon style={{ width: 12, height: 12 }} /> }
            ].map((item) => (
              <Chip
                key={item.value}
                icon={item.icon}
                label={item.label}
                size="small"
                clickable
                color={sortBy === item.value ? 'primary' : 'default'}
                variant={sortBy === item.value ? 'filled' : 'outlined'}
                onClick={() => changeSortBy(item.value)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 3,
                  px: 0.5,
                  backgroundColor: sortBy === item.value ? 'primary.main' : 'background.paper',
                  border: sortBy === item.value ? 'none' : '1px solid rgba(0,0,0,0.08)',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                  '&:hover': {
                    backgroundColor: sortBy === item.value ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* New Updates Banner */}
        {newPostsCount > 0 && (
          <Alert
            severity="info"
            icon={false}
            onClick={() => loadInitialFeed()}
            sx={{
              mb: 3,
              borderRadius: 3,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              border: '1px solid rgba(25, 118, 210, 0.15)',
              color: 'primary.dark',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
            }}
          >
            ✨ {newPostsCount} {newPostsCount === 1 ? 'new post' : 'new posts'} available. Click to refresh.
          </Alert>
        )}

        {/* Social Feed Component */}
        <FeedList
          posts={displayedPosts}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLikeToggle={handleLikeToggle}
          onCommentAdded={handleCommentAdded}
          onReplyAdded={handleReplyAdded}
          onPostUpdated={updatePostLocally}
          onPostDeleted={deletePostLocally}
          onLoadMore={handleLoadMore}
          showSnackbar={showSnackbar}
        />
      </Container>

      {/* Scroll-to-top Floating Action Button with pulsing and lifting micro-interactions */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="medium"
          onClick={handleScrollTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            boxShadow: '0px 4px 16px rgba(25, 118, 210, 0.3)',
            animation: 'pulse 2s infinite',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000,
            '&:hover': {
              transform: 'translateY(-4px) scale(1.05)',
              boxShadow: '0px 8px 24px rgba(25, 118, 210, 0.4)',
            },
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)' },
              '70%': { boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' }
            }
          }}
          aria-label="scroll back to top"
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}

      {/* Global Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 3, boxShadow: '0px 4px 16px rgba(0,0,0,0.1)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home;
