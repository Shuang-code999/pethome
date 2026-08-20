package com.pethome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("seckill_order")
public class SeckillOrder {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private Long voucherId;
    private Long userId;
    private Integer status;
    /** 乐观锁版本号：更新时 WHERE version=?，并发竞争者影响行数=0 */
    @Version
    private Integer version;
    private LocalDateTime createTime;
}
