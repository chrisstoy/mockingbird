# Mockingbird (Or Bardowl, or some other bird)

Basic social media app that will allow users to post stories and comment on other people's Posts.

## Requirements

### Posts

- A Post must consist of up to 1024 characters of text and/or a single image.
- A Post could contain an hyperlink to any website
- A Post could contain a link to an existing Post
- A Post could contain any number of Comments, where each Comment is itself a Post
- A Post must display the name of the Poster and the poster's Avatar
- A User should be able to quickly like or dislike a Post
- A Post could support Hashtags

### Hashtags

- A User should be able to search for Posts that contain a specified Hashtag
-

### Users

- A User must be able to Comment on a Post
- A User must be able to delete their account, including all of their Posts
- A User must be able to set an Avatar image that will be displayed on all their Posts
- A User must be able to view and edit their Profile information

### User Page

- Must display a Feed containing only the Posts from the User

### Feed

- The Feed must display a list of Posts
- The Feed must provide a way to filter which Posts are displayed
- The Feed must provide a way for the current User to create a new Post

### Friends

- A User must be able to request to become a Friend with another User
- A User must be able to accept or reject a Friend request
- A User must be able to remove an existing Friend.
-

# System Components

- Database

```
  tables {

      users {
        id
        // defined by auth system
        friends
      }

      posts {
        id                  // uuid
        createdAt           // date/time post was created
        posterId            // user that created this post
        responseToPostId    // id of post this is a response to
        content             // content of post (markdown?)
        likeCount          // number of times this post has been liked
        dislikeCount       // number of times this post has been disliked
      }
  }
```
