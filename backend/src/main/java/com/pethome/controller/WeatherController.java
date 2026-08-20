package com.pethome.controller;

import com.pethome.common.Result;
import com.pethome.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    /** 获取指定坐标的天气 + 宠物出行建议 */
    @GetMapping
    public Result<Map<String, Object>> weather(@RequestParam double lat,
                                               @RequestParam double lng) {
        return Result.ok(weatherService.getWeather(lat, lng));
    }
}
