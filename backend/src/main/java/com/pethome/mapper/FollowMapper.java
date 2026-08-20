package com.pethome.mapper;

import com.pethome.entity.User;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface FollowMapper {

    @Select("SELECT follower FROM follow WHERE followee = #{userId}")
    List<Long> findFollowers(@Param("userId") Long userId);

    @Select("SELECT followee FROM follow WHERE follower = #{userId}")
    List<Long> findFollowees(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM follow WHERE follower = #{userId} AND followee = #{targetId}")
    int isFollowing(@Param("userId") Long userId, @Param("targetId") Long targetId);

    @Insert("INSERT INTO follow (follower, followee) VALUES (#{userId}, #{targetId})")
    void follow(@Param("userId") Long userId, @Param("targetId") Long targetId);

    @Delete("DELETE FROM follow WHERE follower = #{userId} AND followee = #{targetId}")
    void unfollow(@Param("userId") Long userId, @Param("targetId") Long targetId);

    @Select("SELECT u.* FROM user u INNER JOIN follow f ON u.id = f.followee WHERE f.follower = #{userId} ORDER BY f.create_time DESC")
    List<User> findFolloweeUsers(@Param("userId") Long userId);
}
