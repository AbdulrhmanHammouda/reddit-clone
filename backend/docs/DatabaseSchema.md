# Database Schema Documentation #

#  Reddit Clone – Database Schema Documentation

This document describes the **MongoDB + Mongoose** data model used in the Reddit Clone application.

The backend uses **MongoDB** as the document database and **Mongoose** as the ODM layer for schema validation, indexing, and relationships.  
Each MongoDB collection corresponds to a Mongoose model in `server/models`.

---

#  1. High-Level Architecture

The system models:

- **Users** (accounts, settings, preferences)
- **Communities** (subreddits)
- **Community Memberships**
- **Join Requests**
- **Posts & Comments**
- **Voting** (post votes, comment votes)
- **Follows** (user → user)
- **Saved & Hidden Content**
- **Messages** (direct messages)
- **Notifications**

###  Entity Overview

- `User`
- `Community`
- `CommunityMember`
- `JoinRequest`
- `Post`
- `Comment`
- `Vote`
- `CommentVote`
- `SavedPost`
- `SavedComment`
- `HiddenPost`
- `Follow`
- `Message`
- `Notification`

# 2. Collections in Detail

Each section describes one Mongoose model: fields, types, constraints, indexes, and usage.

---

## 2.1  User

Stores user accounts, profiles, and settings.

**Collection:** `users`

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Yes | Auto | Primary key |
| `username` | String | Yes | Unique | Username |
| `email` | String | Yes | Unique | User email |
| `passwordHash` | String | Yes | – | Hashed password |
| `bio` | String | No | `""` | Short bio |
| `avatar` | String | No | `null` | Avatar URL |
| `displayName` | String | No | `null` | User display name |
| `bannerColor` | String | No | `null` | Profile color |
| `bannerUrl` | String | No | `null` | Banner image |
| `karma` | Number | No | `1` | Starting karma |
| `createdAt` | Date | No | Now | Creation timestamp |
| `updatedAt` | Date | No | Now | Update timestamp |

### User Settings

Stored as nested fields:

- allowFollowers  
- showOnlineStatus  
- allowDirectMessages  
- showInSearchResults  
- showNSFW  
- blurNSFW  
- autoplayMedia  
- reduceMotion  
- showRecommendations  
- emailNotifications  
- commentReplyNotifications  
- mentionNotifications  
- upvoteNotifications  
- newFollowerNotifications  
- chatMessageNotifications  

### Indexes

- `username` unique  
- `email` unique  

### Usage

Referenced by nearly every entity: posts, comments, communities, votes, follows, messages, notifications.

---

## 2.2 Community

Represents a subreddit-like community.

**Collection:** `communities`

### Schema Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `_id` | ObjectId | Yes | Auto |
| `name` | String | Yes | Unique slug |
| `title` | String | Yes | – |
| `description` | String | No | `""` |
| `createdBy` | ObjectId (User) | Yes | – |
| `isPrivate` | Boolean | No | `false` |
| `rules` | [String] | No | `[]` |
| `icon` | String | No | `/default-community.png` |
| `banner` | String | No | `""` |
| `membersCount` | Number | No | `0` |
| `interests` | [String] | No | `[]` |
| `createdAt` | Date | No | Now |

### Indexes

- `name` unique  

### Usage

Communities host posts, and users join them via CommunityMember.

---

## 2.3 CommunityMember

Stores membership mapping & moderator roles.

**Collection:** `communitymembers`

### Schema Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `_id` | ObjectId | Yes | Auto |
| `user` | ObjectId (User) | Yes | – |
| `community` | ObjectId (Community) | Yes | – |
| `role` | String | No | `"member"` |
| `createdAt` | Date | No | Now |

### Indexes

- `{ user, community }` unique

### Usage

Determines:

- Membership  
- Moderator privileges  
- Section visibility  

---

## 2.4 JoinRequest

Request to join private communities.

**Collection:** `joinrequests`

### Schema Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `_id` | ObjectId | Yes | Auto |
| `user` | ObjectId | Yes | – |
| `community` | ObjectId | Yes | – |
| `status` | String | No | `"pending"` |
| `message` | String | No | `""` |
| `reviewedBy` | ObjectId | No | – |
| `reviewedAt` | Date | No | – |
| `createdAt` | Date | No | Now |

### Indexes

- `{ user, community, status }`

---

## 2.5 Post

All user-generated posts.

**Collection:** `posts`

### Schema Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `_id` | ObjectId | Yes | Auto |
| `title` | String | Yes | – |
| `body` | String | No | `null` |
| `author` | ObjectId | Yes | – |
| `community` | ObjectId | Yes | – |
| `url` | String | No | `null` |
| `images` | [String] | No | `[]` |
| `videoUrl` | String | No | `null` |
| `processing` | Boolean | No | `false` |
| `score` | Number | No | `0` |
| `commentsCount` | Number | No | `0` |
| `createdAt` | Date | No | Now |
| `updatedAt` | Date | No | Now |

### Indexes

- `{ community, createdAt }`
- `{ author, createdAt }`
- `{ community, score }`
- Text search: `{ title, body }`

---

## 2.6 Comment

Comments and replies.

**Collection:** `comments`

### Schema Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `_id` | ObjectId | Yes | Auto |
| `post` | ObjectId | Yes | – |
| `author` | ObjectId | Yes | – |
| `body` | String | Yes | – |
| `parent` | ObjectId | No | `null` |
| `score` | Number | No | `0` |
| `images` | [String] | No | `[]` |
| `createdAt` | Date | No | Now |

### Indexes

- `{ post, createdAt }`
- `{ author, createdAt }`
- `post`, `author`, `parent`

---

## 2.7 Vote

Votes on **posts**.

**Collection:** `votes`

### Schema Fields

| Field | Type | Required |
|-------|------|----------|
| `_id` | ObjectId | Yes |
| `user` | ObjectId | Yes |
| `post` | ObjectId | Yes |
| `value` | Number | Yes (1 or -1) |
| `createdAt` | Date | No |

### Indexes

- `{ user, post }` unique

---

## 2.8 CommentVote

Votes on **comments**.

**Collection:** `commentvotes`

| Field | Type | Required |
|-------|------|----------|
| `_id` | ObjectId | Yes |
| `user` | ObjectId | Yes |
| `comment` | ObjectId | Yes |
| `value` | Number | Yes (1 or -1) |
| `createdAt` | Date | No |

### Indexes

- `{ user, comment }` unique  

---

## 2.9 SavedPost

Saved posts.

**Collection:** `savedposts`

| Field | Type | Required |
|-------|------|----------|
| `_id` | ObjectId | Yes |
| `user` | ObjectId | Yes |
| `post` | ObjectId | Yes |
| `createdAt` | Date | No |

### Indexes

- `{ user, post }` unique  

---

## 2.10 SavedComment

Saved comments.

**Collection:** `savedcomments`

| Field | Type | Required |
|-------|------|----------|
| `_id` | ObjectId |
| `user` | ObjectId |
| `comment` | ObjectId |
| `createdAt` | Date |

### Indexes

- `{ user, comment }` unique  

---

## 2.11 HiddenPost

Hidden posts.

**Collection:** `hiddenposts`

| Field | Type | Required |
|-------|------|----------|
| `_id` | ObjectId |
| `user` | ObjectId |
| `post` | ObjectId |
| `createdAt` | Date |
| `updatedAt` | Date |

### Indexes

- `{ user, post }` unique  

---

## 2.12 Follow

User-to-user follow relationship.

**Collection:** `follows`

| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `follower` | ObjectId |
| `following` | ObjectId |
| `createdAt` | Date |
| `updatedAt` | Date |

### Indexes

- `{ follower, following }` unique  

---

## 2.13 Message

Direct messages between users.

**Collection:** `messages`

| Field | Type |
|-------|------|
| `_id` | ObjectId |
| `sender` | ObjectId |
| `receiver` | ObjectId |
| `content` | String |
| `read` | Boolean |
| `createdAt` | Date |

---

## 2.14 Notification

User notifications.

**Collection:** `notifications`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | – |
| `user` | ObjectId | Recipient |
| `type` | String | reply / vote / message / follow / invite |
| `sourceUser` | ObjectId | Triggering user |
| `sourcePost` | ObjectId | Related post |
| `sourceComment` | ObjectId | Related comment |
| `sourceCommunity` | ObjectId | Related community |
| `read` | Boolean | Read flag |
| `createdAt` | Date | Timestamp |

---

# 3. Design Patterns & Considerations

## 3.1 Denormalization

Cached values to speed up read operations:

- `Post.score`
- `Post.commentsCount`
- `Comment.score`
- `Community.membersCount`

## 3.2 Relationship Collections

Many-to-many relationships stored as documents:

- CommunityMember  
- Follow  
- Vote / CommentVote  
- SavedPost / SavedComment / HiddenPost  

## 3.3 Index Strategy

Indexes optimize:

- Community pages  
- User profiles  
- Post feeds  
- Vote uniqueness  
- Follow relationships  

## 3.4 Delete Strategy

System uses **hard deletes**.  
Soft delete can be added with a `deleted: Boolean` flag.

## 3.5 Scaling

- Flat comments (no deep nesting)  
- Vote collections prevent huge arrays  
- Text index for searching posts  

---

# 4. Example Query Patterns

### Newest posts in a community
```javascript
Post.find({ community: communityId })
    .sort({ createdAt: -1 })
    .limit(25);


Top posts in a community
Post.find({ community: communityId })
    .sort({ score: -1 })
    .limit(25);

Root-level comments
Comment.find({ post: postId, parent: null })
       .sort({ createdAt: 1 });

Saved posts for a user
SavedPost.find({ user: userId }).populate('post');

Check community membership
CommunityMember.findOne({ user: userId, community: communityId });

Unread notifications
Notification.find({ user: userId, read: false })
            .sort({ createdAt: -1 });
```
