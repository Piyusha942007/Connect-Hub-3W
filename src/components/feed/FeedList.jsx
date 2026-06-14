import React from 'react';
import PostCard from '../post/PostCard';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import ForumIcon from '@mui/icons-material/Forum';

// Beautiful layout Skeleton matching PostCard structure
const PostCardSkeleton = () => (
  <Card sx={{ mb: 3 }}>
    <CardHeader
      avatar={<Skeleton animation="wave" variant="circular" width={40} height={40} />}
      title={<Skeleton animation="wave" height={14} width="30%" sx={{ mb: 1 }} />}
      subheader={<Skeleton animation="wave" height={10} width="15%" />}
    />
    <CardContent sx={{ pt: 0, pb: 1 }}>
      <Skeleton animation="wave" height={14} sx={{ mb: 1 }} />
      <Skeleton animation="wave" height={14} width="80%" sx={{ mb: 2 }} />
    </CardContent>
    <Skeleton animation="wave" variant="rectangular" height={220} />
    <CardActions sx={{ py: 1.5, px: 2, justifyContent: 'space-around' }}>
      <Skeleton animation="wave" height={24} width="20%" />
      <Skeleton animation="wave" height={24} width="20%" />
    </CardActions>
  </Card>
);

const FeedList = ({
  posts,
  loading,
  loadingMore,
  hasMore,
  onLikeToggle,
  onCommentAdded,
  onReplyAdded,
  onPostUpdated,
  onPostDeleted,
  onLoadMore,
  showSnackbar,
}) => {
  // 1. Initial Loading State: Render multiple skeleton cards
  if (loading && posts.length === 0) {
    return (
      <Box>
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </Box>
    );
  }

  // 2. Empty State: Render helpful empty panel if feed is dry
  if (!loading && posts.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', backgroundColor: 'background.paper', borderRadius: 4 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            color: 'primary.main',
            borderRadius: '50%',
            p: 3,
            mb: 2.5,
          }}
        >
          <ForumIcon sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
          No posts yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 350, mx: 'auto', mb: 3 }}>
          Be the first to share something with the community.
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Posts Feed */}
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onLikeToggle={onLikeToggle}
          onCommentAdded={onCommentAdded}
          onReplyAdded={onReplyAdded}
          onPostUpdated={onPostUpdated}
          onPostDeleted={onPostDeleted}
          showSnackbar={showSnackbar}
        />
      ))}

      {/* Paginated Feed: Load More button at bottom */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 6 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onLoadMore}
            disabled={loadingMore}
            sx={{
              borderRadius: 8,
              px: 4,
              py: 1,
              fontWeight: 600,
              boxShadow: '0px 2px 8px rgba(25, 118, 210, 0.1)',
            }}
          >
            {loadingMore ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Loading more...</span>
              </Box>
            ) : (
              'Load More'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FeedList;
