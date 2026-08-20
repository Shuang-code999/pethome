package com.pethome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pethome.entity.Comment;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface CommentMapper extends BaseMapper<Comment> {

    @Select("SELECT c.*, u.nickname as author FROM comment c LEFT JOIN user u ON c.user_id = u.id WHERE c.post_id = #{postId} ORDER BY c.create_time ASC")
    List<Comment> findByPostId(@Param("postId") Long postId);
}
