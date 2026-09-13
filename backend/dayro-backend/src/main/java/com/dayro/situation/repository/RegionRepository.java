package com.dayro.situation.repository;

import com.dayro.situation.domain.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegionRepository extends JpaRepository<Region, UUID> {
    List<Region> findAllByOrderByCategoryOrderAscSortOrderAsc();

    List<Region> findAllByNameIn(List<String> names);

    Optional<Region> findByDistrictId(String districtId);
}
