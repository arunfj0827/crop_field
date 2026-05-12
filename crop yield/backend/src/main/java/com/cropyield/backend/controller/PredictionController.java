package com.cropyield.backend.controller;

import com.cropyield.backend.dto.PredictionRequest;
import com.cropyield.backend.entity.Prediction;
import com.cropyield.backend.service.PredictionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*")
public class PredictionController {

    private final PredictionService service;

    public PredictionController(PredictionService service) {
        this.service = service;
    }

    @PostMapping
    public Prediction predict(@RequestBody PredictionRequest request) {
        return service.getPrediction(request);
    }

    @GetMapping
    public List<Prediction> getHistory() {
        return service.getAllPredictions();
    }
}
