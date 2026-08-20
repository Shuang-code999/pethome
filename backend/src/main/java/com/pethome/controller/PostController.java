package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.entity.Comment;
import com.pethome.entity.Post;
import com.pethome.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /** 发帖（需登录）：写 DB + 推送到粉丝 Feed */
    @PostMapping("/posts")
    public Result<Post> create(@RequestBody Post post) {
        return Result.ok(postService.create(post));
    }

    /** Feed 流（部分公开）：支持 recommend/follow/latest */
    @GetMapping("/feed")
    public Result<List<Post>> feed(@RequestParam(defaultValue = "recommend") String tab,
                                   @RequestParam(defaultValue = "0") long max,
                                   @RequestParam(defaultValue = "20") int size,
                                   @RequestParam(defaultValue = "") String type) {
        return Result.ok(postService.feed(tab, max, size, type));
    }

    /** 帖子详情 */
    @GetMapping("/posts/{id}")
    public Result<Post> detail(@PathVariable Long id) {
        return Result.ok(postService.getById(id));
    }

    /** 点赞 */
    @PostMapping("/posts/{id}/like")
    public Result<Void> like(@PathVariable Long id) {
        postService.like(id);
        return Result.ok();
    }

    /** 取消赞 */
    @DeleteMapping("/posts/{id}/like")
    public Result<Void> unlike(@PathVariable Long id) {
        postService.unlike(id);
        return Result.ok();
    }

    /** 是否已点赞 */
    @GetMapping("/posts/{id}/liked")
    public Result<Boolean> liked(@PathVariable Long id) {
        return Result.ok(postService.isLiked(id));
    }

    /** 评论列表 */
    @GetMapping("/posts/{id}/comments")
    public Result<List<Comment>> comments(@PathVariable Long id) {
        return Result.ok(postService.comments(id));
    }

    /** 发表评论 */
    @PostMapping("/posts/{id}/comments")
    public Result<Comment> comment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String content = (String) body.get("content");
        Long parentId = body.get("parentId") instanceof Number n ? n.longValue() : null;
        return Result.ok(postService.comment(id, content, parentId));
    }

    /** 某用户的帖子列表（用于用户主页） */
    @GetMapping("/user/{userId}/posts")
    public Result<List<Post>> userPosts(@PathVariable Long userId,
                                        @RequestParam(defaultValue = "20") int size) {
        return Result.ok(postService.postsByUser(userId, size));
    }

    /** 热门（按 likes DESC），type 可选 qa/topic/adopt/post */
    @GetMapping("/posts/hot")
    public Result<List<Post>> hot(@RequestParam(defaultValue = "") String type,
                                  @RequestParam(defaultValue = "30") int limit) {
        return Result.ok(postService.hot(type, limit));
    }

    /** 推荐（随机/同城），type 可选 */
    @GetMapping("/posts/recommend")
    public Result<List<Post>> recommend(@RequestParam(defaultValue = "") String type,
                                        @RequestParam(defaultValue = "") String city,
                                        @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(postService.recommend(type, city, limit));
    }
}
