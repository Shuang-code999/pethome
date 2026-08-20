package com.pethome.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 强制 Tomcat 用 UTF-8 解码 query string
 *  - Spring Boot 3.x 的 application.yml 中 server.tomcat.uri-encoding 在某些环境
 *    不生效（被 Connector 早初始化覆盖），这里直接构造时设置。
 *  - 影响：?q=中文 这种带 URL 编码的参数能正确解析为 UTF-8 字符。
 */
@Configuration
public class TomcatUtf8Config {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatUtf8Customizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setURIEncoding("UTF-8");
            connector.setProperty("useBodyEncodingForURI", "true");
        });
    }
}