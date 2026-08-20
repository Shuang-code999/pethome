package com.pethome.util;

import lombok.extern.slf4j.Slf4j;

/** 基于 ThreadLocal 的当前用户上下文 */
@Slf4j
public class UserContext {
    private static final ThreadLocal<Long> CURRENT = new ThreadLocal<>();

    public static void set(Long id) { CURRENT.set(id); }
    public static Long get() { return CURRENT.get(); }
    public static Long require() {
        Long id = CURRENT.get();
        if (id == null) throw new IllegalStateException("未登录");
        return id;
    }
    public static void clear() { CURRENT.remove(); }
}
