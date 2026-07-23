package com.dayro.situation.repository;

import com.dayro.situation.domain.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegionRepository extends JpaRepository<Region, UUID> {
    List<Region> findAllByOrderByCategoryOrderAscSortOrderAsc();
}
